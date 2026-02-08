import requests
import time
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def run_test():
    print("Starting API Scenario Test...")
    
    # Generate random user credentials
    random_str = str(uuid.uuid4())[:8]
    username = f"testuser_{random_str}"
    password = "testpassword"
    email = f"{username}@example.com"
    
    # 1. Register
    print(f"\n1. Registering user: {username}")
    reg_data = {"username": username, "password": password, "email": email}
    resp = requests.post(f"{BASE_URL}/register", json=reg_data)
    if resp.status_code != 200:
        print(f"Registration failed: {resp.text}")
        return
    user_id = resp.json()['user_id']
    print(f"   -> Registered successfully. User ID: {user_id}")
    
    # 2. Login
    print("\n2. Logging in")
    login_data = {"username": username, "password": password}
    resp = requests.post(f"{BASE_URL}/token", data=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    print("   -> Logged in successfully.")
    
    # 3. Create Folder
    print("\n3. Creating Folder")
    folder_data = {"name": "Test Math Workbook"}
    resp = requests.post(f"{BASE_URL}/folders", json=folder_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create folder failed: {resp.text}")
        return
    folder = resp.json()
    folder_id = folder['folder_id']
    print(f"   -> Folder created: {folder['name']} (ID: {folder_id})")
    
    # 4. Create Curriculum
    print("\n4. Creating Curriculum")
    curr_data = {"name": "Calculus I", "level": 1, "sort_order": 1}
    resp = requests.post(f"{BASE_URL}/curriculums", json=curr_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create curriculum failed: {resp.text}")
        return
    curr = resp.json()
    curr_id = curr['curriculum_id']
    print(f"   -> Curriculum created: {curr['name']} (ID: {curr_id})")
    
    # 5. Create Problem
    print("\n5. Creating Problem")
    prob_data = {
        "title": "Derivative of x^2",
        "folder_id": folder_id,
        "curriculum_id": curr_id,
        "hints": ["Power rule", "n*x^(n-1)"]
    }
    resp = requests.post(f"{BASE_URL}/problems", json=prob_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create problem failed: {resp.text}")
        return
    problem = resp.json()
    problem_id = problem['problem_id']
    print(f"   -> Problem created: {problem['title']} (ID: {problem_id})")
    
    # 6. Create Study Session
    print("\n6. Creating Study Session")
    session_data = {
        "name": "Midterm Prep",
        "mode": "all",
        "folder_ids": [folder_id],
        "curriculum_ids": [curr_id]
    }
    resp = requests.post(f"{BASE_URL}/sessions", json=session_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create session failed: {resp.text}")
        return
    session = resp.json()
    session_id = session['study_session_id']
    print(f"   -> Session created: {session['name']} (ID: {session_id})")
    
    # 7. Get Session Problems
    print("\n7. Fetching Session Problems")
    resp = requests.get(f"{BASE_URL}/sessions/{session_id}/problems", headers=headers)
    if resp.status_code != 200:
        print(f"Get session problems failed: {resp.text}")
        return
    problems = resp.json()
    print(f"   -> Found {len(problems)} problems in session.")
    if len(problems) == 0:
        print("   !! No problems found, check logic.")
    
    # 8. Solve Problem
    print("\n8. Solving Problem")
    solve_data = {
        "study_session_id": session_id,
        "solution": "2x",
        "is_correct": True,
        "time_spent": 45
    }
    resp = requests.post(f"{BASE_URL}/problems/{problem_id}/solve", json=solve_data, headers=headers)
    if resp.status_code != 200:
        print(f"Solve problem failed: {resp.text}")
        return
    print("   -> Problem solved and log saved.")
    
    print("\n✅ All tests passed successfully!")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
