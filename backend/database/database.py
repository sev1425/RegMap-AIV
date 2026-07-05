# ==========================================================
# REGMAP AI ENTERPRISE
# SQLITE DATABASE
# ==========================================================

import sqlite3
import json
import os
from pathlib import Path
from dataclasses import asdict


class RegMapDatabase:

    def __init__(self, db_name="regmap.db"):

        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", db_name)

        self.connection = sqlite3.connect(
            str(self.db_path),
            check_same_thread=False
        )

        self.create_tables()

    # ======================================================
    # Create Tables
    # ======================================================

    def create_tables(self):

        cursor = self.connection.cursor()

        cursor.execute("""

        CREATE TABLE IF NOT EXISTS analyses(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            title TEXT,

            compliance_score REAL,

            overall_risk TEXT,

            confidence REAL,

            executive_dashboard TEXT,

            cko_json TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )

        """)

        try:
            cursor.execute(
                "ALTER TABLE analyses ADD COLUMN cko_json TEXT"
            )
        except sqlite3.OperationalError:
            pass

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT DEFAULT 'default',
            role TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_trail(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            action_type TEXT,
            description TEXT,
            prev_hash TEXT,
            hash TEXT
        )
        """)

        self.connection.commit()

        cursor.close()

    # ======================================================
    # Save Analysis
    # ======================================================

    def save_analysis(self, cko):

        cursor = self.connection.cursor()

        business_impact = getattr(
            cko,
            "business_impact",
            {}
        ) or {}

        executive_dashboard = getattr(
            cko,
            "executive_dashboard",
            {}
        )

        try:
            cko_dict = asdict(cko)
            cko_json_str = json.dumps(cko_dict)
        except Exception:
            cko_json_str = "{}"

        cursor.execute("""

        INSERT INTO analyses(

            title,

            compliance_score,

            overall_risk,

            confidence,

            executive_dashboard,

            cko_json

        )

        VALUES(?,?,?,?,?,?)

        """,

        (

            getattr(cko, "title", "Untitled"),

            getattr(cko, "compliance_score", 0),

            business_impact.get(
                "overall_risk",
                getattr(cko, "priority", "Unknown")
            ),

            business_impact.get(
                "confidence",
                0
            ),

            json.dumps(executive_dashboard),

            cko_json_str

        )

        )

        self.connection.commit()

        cursor.close()

        print("[DATABASE] Analysis Saved Successfully")

    # ======================================================
    # Get All Analyses
    # ======================================================

    def get_all_analyses(self):

        cursor = self.connection.cursor()

        cursor.execute(
            "SELECT * FROM analyses"
        )

        rows = cursor.fetchall()

        cursor.close()

        return rows

    # ======================================================
    # Latest Analysis
    # ======================================================

    def get_latest_cko_json(self):

        cursor = self.connection.cursor()

        cursor.execute(
            "SELECT cko_json FROM analyses ORDER BY id DESC LIMIT 1"
        )

        row = cursor.fetchone()

        cursor.close()

        if row and row[0]:

            try:
                return json.loads(row[0])
            except Exception:
                return None

        return None

    # ======================================================
    # Update Latest Analysis
    # ======================================================

    def update_latest_cko_json(self, cko_dict):
        cursor = self.connection.cursor()
        cursor.execute("SELECT id FROM analyses ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            latest_id = row[0]
            cko_json_str = json.dumps(cko_dict)
            cursor.execute(
                "UPDATE analyses SET cko_json = ? WHERE id = ?",
                (cko_json_str, latest_id)
            )
            self.connection.commit()
        cursor.close()

    # ======================================================
    # Copilot Conversations
    # ======================================================

    def save_message(self, session_id, role, content):
        cursor = self.connection.cursor()
        cursor.execute(
            "INSERT INTO conversations(session_id, role, content) VALUES(?, ?, ?)",
            (session_id, role, content)
        )
        self.connection.commit()
        cursor.close()

    def get_conversation(self, session_id="default"):
        cursor = self.connection.cursor()
        cursor.execute(
            "SELECT role, content FROM conversations WHERE session_id = ? ORDER BY id ASC",
            (session_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        return [{"role": r[0], "content": r[1]} for r in rows]
    
    def clear_conversation(self, session_id="default"):
        cursor = self.connection.cursor()
        cursor.execute("DELETE FROM conversations WHERE session_id = ?", (session_id,))
        self.connection.commit()
        cursor.close()

    # ======================================================
    # Audit Trail
    # ======================================================

    def save_audit_entry(self, action_type, description):
        import hashlib
        from datetime import datetime, timezone
        
        cursor = self.connection.cursor()
        
        # Get the previous hash
        cursor.execute("SELECT hash FROM audit_trail ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        prev_hash = row[0] if row else "0" * 64

        timestamp_str = datetime.now(timezone.utc).isoformat()
        
        # Compute new hash
        hash_input = f"{timestamp_str}|{action_type}|{description}|{prev_hash}"
        new_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

        cursor.execute(
            "INSERT INTO audit_trail(timestamp, action_type, description, prev_hash, hash) VALUES(?, ?, ?, ?, ?)",
            (timestamp_str, action_type, description, prev_hash, new_hash)
        )
        self.connection.commit()
        
        # Return the newly created entry as a dict
        cursor.execute("SELECT id, timestamp, action_type, description, prev_hash, hash FROM audit_trail ORDER BY id DESC LIMIT 1")
        inserted = cursor.fetchone()
        cursor.close()
        
        if inserted:
            return {
                "id": inserted[0],
                "timestamp": inserted[1],
                "action_type": inserted[2],
                "description": inserted[3],
                "prev_hash": inserted[4],
                "hash": inserted[5]
            }
        return {}

    def get_audit_trail(self):
        cursor = self.connection.cursor()
        cursor.execute("SELECT id, timestamp, action_type, description, prev_hash, hash FROM audit_trail ORDER BY id ASC")
        rows = cursor.fetchall()
        cursor.close()
        return [
            {
                "id": r[0],
                "timestamp": r[1],
                "action_type": r[2],
                "description": r[3],
                "prev_hash": r[4],
                "hash": r[5]
            } for r in rows
        ]
        
    def verify_chain(self):
        import hashlib
        trail = self.get_audit_trail()
        if not trail:
            return True, "No audit trail found."
            
        expected_prev_hash = "0" * 64
        
        for entry in trail:
            if entry["prev_hash"] != expected_prev_hash:
                return False, f"Chain broken at ID {entry['id']}: prev_hash mismatch."
                
            hash_input = f"{entry['timestamp']}|{entry['action_type']}|{entry['description']}|{entry['prev_hash']}"
            computed_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()
            
            if entry["hash"] != computed_hash:
                return False, f"Chain broken at ID {entry['id']}: hash mismatch."
                
            expected_prev_hash = entry["hash"]
            
        return True, "Audit chain is valid."