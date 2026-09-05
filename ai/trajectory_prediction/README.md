# Model 3: Iceberg Trajectory Prediction

Run these commands from `ai/trajectory_prediction` after Python is available:

```powershell
..\\..\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt
..\\..\\.venv\\Scripts\\python.exe preprocessing\\clean_tracks.py
..\\..\\.venv\\Scripts\\python.exe preprocessing\\build_sequences.py
..\\..\\.venv\\Scripts\\python.exe model\\train_lstm.py
```

The first baseline uses 14 daily positions and predicts local north/east displacement at 24, 48, and 72 hours. It evaluates against persistence and constant-velocity baselines in `model/artifacts/evaluation.json`.

Environmental data is deliberately not fabricated. Add Model 2 wind/current/sea-ice/SST fields to the sequence feature list only after they are spatially and temporally aligned with each historical observation and available as forecasts during inference.
