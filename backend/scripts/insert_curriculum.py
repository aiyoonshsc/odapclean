import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Add parent directory to path to import models if needed, 
# but here we just need supabase client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
    sys.exit(1)

supabase: Client = create_client(url, key)

def get_or_create_curriculum(name: str, level: int, parent_id: int = None, sort_order: int = 0):
    # Check if exists
    query = supabase.table('curriculums').select("*").eq('name', name).eq('level', level)
    if parent_id:
        query = query.eq('parent_id', parent_id)
    else:
        query = query.is_('parent_id', 'null')
    
    response = query.execute()
    
    if response.data:
        print(f"Found existing: {name} (ID: {response.data[0]['curriculum_id']})")
        return response.data[0]['curriculum_id']
    
    # Create
    data = {
        "name": name,
        "level": level,
        "sort_order": sort_order
    }
    if parent_id:
        data["parent_id"] = parent_id
        
    response = supabase.table('curriculums').insert(data).execute()
    if response.data:
        print(f"Created: {name} (ID: {response.data[0]['curriculum_id']})")
        return response.data[0]['curriculum_id']
    else:
        print(f"Failed to create: {name}")
        return None

def main():
    print("Starting curriculum insertion...")
    
    # Level 1: 고등수학
    l1_id = get_or_create_curriculum("고등수학", 1, sort_order=1)
    if not l1_id: return

    # Level 2: 대수
    l2_id = get_or_create_curriculum("대수", 2, parent_id=l1_id, sort_order=1)
    if not l2_id: return

    # Level 3: Topics
    topics = [
        "지수",
        "로그",
        "지수함수",
        "로그함수",
        "삼각함수",
        "삼각함수그래프",
        "삼각함수활용",
        "등차수열",
        "등비수열",
        "수열의합",
        "수학적귀납법"
    ]

    for idx, topic in enumerate(topics):
        get_or_create_curriculum(topic, 3, parent_id=l2_id, sort_order=idx+1)

    print("Done!")

if __name__ == "__main__":
    main()
