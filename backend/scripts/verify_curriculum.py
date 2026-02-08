import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def verify_curriculum():
    # Fetch all
    response = supabase.table('curriculums').select("*").order('level, sort_order').execute()
    items = response.data
    
    # Build tree
    tree = {}
    for item in items:
        tree[item['curriculum_id']] = item
        item['children'] = []
        
    roots = []
    for item in items:
        pid = item.get('parent_id')
        if pid:
            if pid in tree:
                tree[pid]['children'].append(item)
        else:
            roots.append(item)
            
    def print_node(node, indent=0):
        print("  " * indent + f"- {node['name']} (ID: {node['curriculum_id']})")
        for child in node['children']:
            print_node(child, indent + 1)

    print("\nCurrent Curriculum Hierarchy:")
    for root in roots:
        print_node(root)

if __name__ == "__main__":
    verify_curriculum()
