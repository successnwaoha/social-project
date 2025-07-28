import os
import asyncio
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from paystackease.apis.async_apis.atransactions import AsyncTransactionClientAPI
from hypercorn.config import Config
from hypercorn.asyncio import serve
from typing import Union

# --- Step 1: Load environment variables from .env file ---
# This happens first, so all keys are available immediately.
load_dotenv()

# --- Step 2: Initialize the Flask App ---
app = Flask(__name__)
# CORS is crucial for allowing your frontend (on a different address) to talk to the backend.
CORS(app)

# --- Step 3: Connect to Services ---

# -- Supabase Client --
# We will use the SERVICE_ROLE key here. This gives our backend full admin rights
# to the database, allowing it to bypass Row Level Security. This is the correct
# and secure way to set up a trusted backend server.
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") # <-- MODIFIED to use the master key

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file")

# The supabase client is created using the powerful service key.
supabase: Client = create_client(supabase_url, supabase_key)


# -- Paystack Client --
# Check for the key, but the client itself will be created later when the app starts.
paystack_secret = os.getenv("PAYSTACK_SECRET_KEY")
if not paystack_secret:
    raise ValueError("PAYSTACK_SECRET_KEY must be set in your .env file")

# We declare the variable here, but we will create it inside startup().
transaction_client: Union[AsyncTransactionClientAPI, None] = None


# --- Step 4: Application Lifecycle Functions ---
# These functions run when the server starts and stops.

async def startup():
    """Initializes the async Paystack client when the server starts."""
    global transaction_client
    print("INFO:     Server is starting up. Initializing Paystack client...")
    transaction_client = AsyncTransactionClientAPI()
    print("INFO:     Paystack client ready.")

async def shutdown():
    """Closes the async client's session when the server stops."""
    global transaction_client
    if transaction_client and hasattr(transaction_client, '_session') and not transaction_client._session.closed:
        print("INFO:     Server is shutting down. Closing Paystack client session...")
        await transaction_client._session.close()
        print("INFO:     Paystack client session closed.")


# --- Step 5: API Endpoints ---
# These are the URLs your frontend will call.

@app.route('/api/signup', methods=['POST'])
def signup():
    """Handles new user registration."""
    try:
        # Get all required data from the frontend
        data = request.get_json()
        email, password, username = data.get('email'), data.get('password'), data.get('username')
        if not email or not password or not username:
            return jsonify({"error": "Username, email, and password are required"}), 400
        
        # Action 1: Create the user in Supabase's special 'auth.users' table.
        res = supabase.auth.sign_up({"email": email, "password": password})
        
        # Action 2: If the user was created successfully...
        if res.user:
            # ...insert their profile into our public 'profiles' table.
            # This works now because our server is using the service_role key and can bypass RLS.
            supabase.table('profiles').insert({'id': res.user.id, 'username': username}).execute()
            return jsonify({"message": "User created successfully! Check email for verification.", "user": res.user.dict()}), 201
        
        return jsonify({"error": "Could not create user. It may already exist."}), 400
    except Exception as e:
        # This will now correctly report errors like "username already taken".
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Handles user login."""
    try:
        data = request.get_json()
        email, password = data.get('email'), data.get('password')
        session = supabase.auth.sign_in_with_password({"email": email, "password": password})
        return jsonify({"message": "Logged in successfully!", "session": session.dict()}), 200
    except Exception as e:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/initialize-payment', methods=['POST'])
async def initialize_payment():
    """Starts a payment process with Paystack."""
    try:
        data = request.get_json()
        email = data.get('email')
        # Paystack expects amount in kobo (lowest currency unit)
        amount_in_kobo = int(data.get('amount')) * 100
        if not email or not amount_in_kobo:
            return jsonify({"error": "Email and amount are required"}), 400
        
        response = await transaction_client.initialize(email=email, amount=amount_in_kobo)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/verify-payment/<reference>')
async def verify_payment(reference):
    """Verifies a payment after the user returns from Paystack."""
    try:
        response = await transaction_client.verify(reference=reference)
        if response.status and response.data.get('status') == 'success':
            print(f"Payment successful for reference: {reference}")
            # TODO: Add logic here to update the user's balance in your database.
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


# --- Step 6: The Main Function to Run the Server ---
async def main():
    """Configures and runs the Hypercorn server."""
    config = Config()
    config.bind = ["localhost:5000"]
    # Tell Hypercorn to run our startup and shutdown functions
    config.startup = startup
    config.shutdown = shutdown
    
    print("INFO:     Starting web server...")
    await serve(app, config)

if __name__ == '__main__':
    asyncio.run(main())