import os
debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
assert debug_mode == False, "Default debug mode should be False"

os.environ["FLASK_DEBUG"] = "true"
debug_mode_true = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
assert debug_mode_true == True, "Debug mode should be True when FLASK_DEBUG is set"

print("PASS: debug_mode logic works correctly")
