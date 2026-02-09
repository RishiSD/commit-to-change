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
from pydantic import ValidationError

from agent_v5 import create_agent_graph
from tools.models import UnifiedRecipeResult

opik_tracer = OpikTracer()

# Use in-memory checkpointer
checkpointer = MemorySaver()
agent = create_agent_graph(checkpointer)

client = Opik()
dataset = client.get_or_create_dataset(name="agent_tool_selection")
dataset.insert([
    {
        "input": "Extract recipe from https://www.tiktok.com/@eatswithally/video/7603894450959568142?is_from_webapp=1&sender_device=pc&web_id=7594485989775853078",
        "expected_tool": ["extract_and_process_recipe"]
    },
    {
        "input": "Extract recipe from https://www.instagram.com/reel/DCR9-Y8Sdga/",
        "expected_tool": ["extract_and_process_recipe"]
    },
    {
        "input": "Extract recipe from https://www.recipetineats.com/new-orleans-chicken-wings/",
        "expected_tool": ["extract_and_process_recipe"]
    },
    {
        "input": "Extract recipe from https://www.tiktok.com/@jalalsamfit/video/7603783300997500182?is_from_webapp=1&sender_device=pc&web_id=7594485989775853078",
        "expected_tool": ["extract_and_process_recipe"]
    },
    {
        "input": "Extract recipe from https://www.tiktok.com/@kookmutsjes/video/7597834018301791510",
        "expected_tool": ["extract_and_process_recipe"]
    },
])

class StrictToolAdherenceMetric(BaseMetric):
    def __init__(self, name: str = "strict_tool_adherence"):
        self.name = name

    def find_tools(self, task_span):
        """Find all tool spans in the SpanModel hierarchy."""
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

    def score(self, task_span: SpanModel,
              expected_tool: List[str], **kwargs):
        # Find tool calls in trajectory
        tool_used = self.find_tools(task_span)

        if tool_used == expected_tool:
            return score_result.ScoreResult(
                value=1.0,
                name=self.name,
                reason=f"Correct: used {tool_used}"
            )
        else:
            return score_result.ScoreResult(
                value=0.0,
                name=self.name,
                reason=f"Used {tool_used}, expected {expected_tool}"
            )

class SchemaValidationMetric(BaseMetric):
    """Validates the extract_and_process_recipe tool call request and response schemas."""
    
    def __init__(self, name: str = "schema_validation"):
        self.name = name

    def find_extract_tool_calls(self, task_span):
        """Find all extract_and_process_recipe tool calls with their inputs and outputs."""
        tool_calls = []
        
        def extract_from_spans(spans):
            """Recursively extract tool calls from spans list."""
            for span in spans:
                # Check if this is the extract_and_process_recipe tool
                if span.type == "tool" and span.name == "extract_and_process_recipe":
                    tool_call = {
                        "name": span.name,
                        "input": span.input,
                        "output": span.output
                    }
                    tool_calls.append(tool_call)
                
                # Recursively check nested spans
                if span.spans:
                    extract_from_spans(span.spans)
        
        # Start the recursive search
        if task_span.spans:
            extract_from_spans(task_span.spans)
        
        return tool_calls

    def validate_input_schema(self, tool_input):
        """Validate tool input (should have 'url' parameter as string)."""
        input_data = tool_input.get("input")
        
        # Handle both string and dict inputs
        if isinstance(input_data, str):
            try:
                input = json.loads(input_data)
            except json.JSONDecodeError:
                # Try to parse as Python literal (handles single quotes)
                import ast
                try:
                    input = ast.literal_eval(input_data)
                except (ValueError, SyntaxError) as e:
                    return False, f"Input is not valid JSON or Python dict: {str(e)}"
        elif isinstance(input_data, dict):
            input = input_data
        else:
            return False, f"Input should be dict or JSON string, got {type(input_data)}"
        
        if input is None:
            return False, "Input is missing"
        if not isinstance(input, dict):
            return False, "Input is not a dictionary"
        
        if "url" not in input:
            return False, "Missing 'url' parameter in input"
        
        if not isinstance(input["url"], str):
            return False, f"URL parameter should be string, got {type(input['url'])}"
        
        if not input["url"].startswith(("http://", "https://")):
            return False, f"URL should start with http:// or https://, got: {input['url']}"
        
        return True, "Input schema valid"

    def validate_output_schema(self, tool_output):
        """Validate tool output against UnifiedRecipeResult schema."""
        print(f"Validating tool output: {tool_output}")
        output_raw = tool_output.get("output").get("content")
        print(f"Raw output content: {output_raw}")
        if output_raw is None:
            return False, "Output is missing"
        try:
            # Parse the output as UnifiedRecipeResult
            if isinstance(output_raw, str):
                try:
                    output = json.loads(output_raw)
                except json.JSONDecodeError:
                    # Try to parse as Python literal (handles single quotes)
                    import ast
                    try:
                        output = ast.literal_eval(output_raw)
                    except (ValueError, SyntaxError) as e:
                        return False, f"Output is not valid JSON or Python dict: {str(e)}"
            elif isinstance(output_raw, dict):
                output = output_raw
            else:
                return False, f"Output must be JSON string or dict, got {type(output_raw)}"
            
            # Validate using Pydantic model
            UnifiedRecipeResult(**output)
            return True, "Output schema valid"
        except ValidationError as e:
            error_details = "; ".join([f"{err['loc']}: {err['msg']}" for err in e.errors()])
            print(f"Output validation error details: {error_details}")
            return False, f"Output schema validation failed: {error_details}"
        except Exception as e:
            print(f"Unexpected error during output validation: {type(e).__name__}: {str(e)}")
            return False, f"Output schema validation error: {str(e)}"

    def score(self, task_span: SpanModel, **kwargs):
        # Find all extract tool calls
        tool_calls = self.find_extract_tool_calls(task_span)
        
        if not tool_calls:
            return score_result.ScoreResult(
                value=0.0,
                name=self.name,
                reason="No extract_and_process_recipe tool calls found"
            )
        
        # Validate each tool call
        all_valid = True
        validation_details = []
        
        for i, tool_call in enumerate(tool_calls):
            call_num = i + 1
            
            # Validate input
            input_valid, input_msg = self.validate_input_schema(tool_call["input"])
            if not input_valid:
                all_valid = False
                validation_details.append(f"Call {call_num} input: {input_msg}")
            else:
                validation_details.append(f"Call {call_num} input: ✓")
            
            # Validate output
            output_valid, output_msg = self.validate_output_schema(tool_call["output"])
            if not output_valid:
                all_valid = False
                validation_details.append(f"Call {call_num} output: {output_msg}")
            else:
                validation_details.append(f"Call {call_num} output: ✓")
        
        reason = "; ".join(validation_details)
        
        return score_result.ScoreResult(
            value=1.0 if all_valid else 0.0,
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
        StrictToolAdherenceMetric(),
        SchemaValidationMetric()
    ]
)
