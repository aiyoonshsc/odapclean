import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing env vars")
    sys.exit(1)

supabase: Client = create_client(url, key)

print(f"Checking Supabase Storage at {url}...")

try:
    # 1. List Buckets (might fail due to permissions, so we ignore result for flow)
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        print(f"Current buckets (visible): {bucket_names}")
    except:
        print("Could not list buckets (expected if Anon). Proceeding to upload test...")

    # 2. Try to upload a test file to verify permissions
    try:
        test_content = b"test content"
        file_name = "test_permission_check.txt"
        
        # Try upload
        print("Attempting test upload to 'problems' bucket...")
        supabase.storage.from_("problems").upload(
            file_name, 
            test_content, 
            {"content-type": "text/plain"}
        )
        print("✅ Test upload successful! Policy is correct.")
        
        # Clean up
        supabase.storage.from_("problems").remove([file_name])
        print("✅ Test file cleaned up.")
        
    except Exception as e:
        print(f"❌ Upload permission check failed: {e}")
        print("Policy is NOT accepting Anon uploads yet.")

except Exception as e:
    print(f"❌ Error connecting to Supabase: {e}")
