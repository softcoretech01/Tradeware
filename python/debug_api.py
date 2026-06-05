import urllib.request
from urllib.error import HTTPError

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/purchase/requisitions/') as response:
        print(response.read().decode())
except HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Exception: {e}")
