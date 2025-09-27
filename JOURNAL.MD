### 22/09/25 Monday

1.  Set up vscode:

    ```bash
    python -m venv venv
    venv\Scripts\activate
    ```
   
2.  Create a requirements.txt with name of all libraries that will be used. 
   Install again if some extras come later.

3. Install requirements.txt:

    ```bash
    pip install -r requirements.txt
    ```

4. Configure VS Code to use the venv:

    Command Palette (Ctrl+Shift+P) → Python: Select Interpreter → choose the venv interpreter in your project folder.

### 25/09/25 Thursday

1. Setup postgresql :

    ```psql
     create database compario
     \c compario
     ```
2. Connect to postgresql

    ```py
    conn = psycopg2.connect(
    host="localhost",
    database="compario",   
    user="postgres",
    password="hello",
    port=5432
    )
    ```

### 26/09/2025 Friday:
<p>Lets do some basic planing:</p>
<ul>
    <li>Initially , the session as well as the cookie is set to logged_in =False and page=hero</li>
    <li>The user sees , the hero/intro page on enter , which shows basic details of the project as well as login and signup buttons</li>
    <li>Clicking on signin will take the user to signin page to fill credentials , once filled and validation checks are done, the credentials are saved into database and the session is marked as logged_in=True and the cookie is set and the user to navigated to the main dashboard page</li>
    <li> If he opts for login , credentials are got from him , mapped against the ones in db , if correctly mapped, redirected to database with session and cookie set.
    </li>
    <li>The dashboard will contain:
        <ol>
        <li>user profile button displaying all his details, and image upload history</li>
        <li>logout button clearing session, cookie and redirecting him back to main login page</li>
        <li> the main home page where he can upload images and find best deail possible</li>
        <li>About page showing about this project (app)</li>
    </li>
    <li>After doing all this , I must train the model using datasets from kaggle for identifying ecommerce products correctly...<li>