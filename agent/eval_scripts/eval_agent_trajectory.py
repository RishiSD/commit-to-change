import sys
import json
from pathlib import Path

# Add parent directory to path to enable imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from opik.integrations.langchain import OpikTracer
from langgraph.checkpoint.memory import MemorySaver
from opik import Opik
from opik.evaluation import evaluate

from opik.evaluation.metrics import BaseMetric, score_result
from opik.message_processing.emulation.models import SpanModel
from typing import List

from agent_v5 import create_agent_graph

opik_tracer = OpikTracer()

# Use in-memory checkpointer
checkpointer = MemorySaver()
agent = create_agent_graph(checkpointer)

client = Opik()
dataset = client.get_or_create_dataset(name="agent_trajectory_evaluation")
dataset.insert([
    {
        "input": "how to make french omlette ?",
        "expected_tool": ["extract_recipe_name", "generate_recipe_from_knowledge"]
    },
    {
        "input": "Extract recipe from https://www.instagram.com/reel/DCR9-Y8Sdga/",
        "expected_tool": ["extract_and_process_recipe"]
    },
    {
        "input": "give me recipe for butter chicken?",
        "expected_tool": ["extract_recipe_name", "generate_recipe_from_knowledge"]
    },
])

class OrderedToolAdherenceMetric(BaseMetric):
    """Checks if the expected tool calls were made in the specified order."""
    
    def __init__(self, name: str = "ordered_tool_adherence"):
        self.name = name

    def find_tools(self, task_span):
        """Find all tool spans in the SpanModel hierarchy in order."""
        tools_used = []
        
        def extract_tools_from_spans(spans):
            """Recursively extract tools from spans list."""
            for span in spans:
                # Check if this span is a tool
                if span.type == "tool" and span.name:
                    tools_used.append(span.name)
                
                # Recursively check nested spans
                if span.spans:
                    extract_tools_from_spans(span.spans)
        
        # Start the recursive search from the top level spans
        if task_span.spans:
            extract_tools_from_spans(task_span.spans)
        
        return tools_used

    def check_ordered_tools(self, tools_used: List[str], expected_tools: List[str]) -> tuple[bool, str]:
        """Check if expected tools appear in order in the tools_used list."""
        if not expected_tools:
            return True, "No expected tools specified"
        
        expected_idx = 0
        
        for tool in tools_used:
            if expected_idx < len(expected_tools) and tool == expected_tools[expected_idx]:
                expected_idx += 1
        
        if expected_idx == len(expected_tools):
            return True, f"All expected tools called in order: {expected_tools}"
        else:
            missing_tools = expected_tools[expected_idx:]
            return False, f"Expected tools {expected_tools} but got {tools_used}. Missing: {missing_tools}"

    def score(self, task_span: SpanModel, expected_tool: List[str], **kwargs):
        # Find tool calls in trajectory
        tools_used = self.find_tools(task_span)
        
        # Check if expected tools were called in order
        is_correct, reason = self.check_ordered_tools(tools_used, expected_tool)

        return score_result.ScoreResult(
            value=1.0 if is_correct else 0.0,
            name=self.name,
            reason=reason
        )


            
def evaluation_task(dataset_item: dict) -> dict:
    res = agent.invoke(
        {"messages": [{
            "role": "user",
            "content": dataset_item["input"]
        }]},
        config={
            "callbacks": [opik_tracer],
            "configurable": {"thread_id": "eval_thread"}
        }
    )
    
    return {"output": res['messages'][-1].content}

# Run the evaluation
experiment = evaluate(
    dataset=dataset,
    task=evaluation_task,
    scoring_metrics=[
        OrderedToolAdherenceMetric()
    ]
)
