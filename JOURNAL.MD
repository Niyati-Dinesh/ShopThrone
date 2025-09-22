### 22/09/25 Monday

1.set up vscode:

    ```bash
    python -m venv venv
    venv\Scripts\activate
    ```
    python -m venv venv:
    python → runs Python.
    -m venv → tells Python: “use the built-in module called venv (virtual environment).”
    venv (the last word) → the folder name where your environment will live.

2. create a requirements.txt wuth name of all libraries that will be use 

3. install requirements.txt:

    ```bash
    pip install -r requirements.txt
    ```

4. Configure VS Code to use the venv:
    Command Palette (Ctrl+Shift+P) → Python: Select Interpreter → choose the venv interpreter in your project folder.