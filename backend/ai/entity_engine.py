# ==========================================================
# REGMAP AI ENTERPRISE
# ENTITY INTELLIGENCE ENGINE
# ==========================================================

import re


class EntityEngine:

    def __init__(self):

        self.organizations = [
            "Reserve Bank of India",
            "RBI",
            "SEBI",
            "MCA",
            "Authorised Dealer",
            "Public Sector Undertakings",
            "PSU"
        ]

        self.departments = [
            "Treasury",
            "Risk",
            "Compliance",
            "Finance",
            "IT",
            "Operations"
        ]

        self.currencies = [
            "INR",
            "Rupee",
            "USD",
            "US Dollar"
        ]

    # ======================================================
    # Entity Analysis
    # ======================================================

    def analyze(self, cko):

        text = cko.raw_text or ""

        entities = {
            "organizations": [],
            "departments": [],
            "currencies": [],
            "dates": []
        }

        lower_text = text.lower()

        # ==================================================
        # Organizations
        # ==================================================

        for org in self.organizations:

          pattern = r"\b" + re.escape(org) + r"\b"

          if re.search(pattern, text, re.IGNORECASE):

                entities["organizations"].append(org)
        # ==================================================
        # Departments
        # ==================================================

        for dept in self.departments:

             pattern = r"\b" + re.escape(dept) + r"\b"

             if re.search(pattern, text, re.IGNORECASE):

                   entities["departments"].append(dept)
        # ==================================================
        # Currencies
        # ==================================================

        for curr in self.currencies:

              pattern = r"\b" + re.escape(curr) + r"\b"

              if re.search(pattern, text, re.IGNORECASE):

                 entities["currencies"].append(curr)

        # ==================================================
        # Dates
        # ==================================================

        date_pattern = r"\d{1,2}\s+[A-Za-z]+\s+\d{4}"

        entities["dates"] = re.findall(date_pattern, text)

        # ==================================================
        # Remove Duplicates
        # ==================================================

        entities["organizations"] = list(dict.fromkeys(entities["organizations"]))
        entities["departments"] = list(dict.fromkeys(entities["departments"]))
        entities["currencies"] = list(dict.fromkeys(entities["currencies"]))
        entities["dates"] = list(dict.fromkeys(entities["dates"]))

        # ==================================================
        # Save to CKO
        # ==================================================

        cko.entities = entities

        # ==================================================
        # Derive issuer and document_type from organizations
        # ==================================================

        orgs = entities.get("organizations", [])

        if orgs:
            cko.issuer = orgs[0]
        else:
            cko.issuer = "Unknown Issuer"

        # Classify document_type based on known regulatory bodies
        org_set = {o.upper() for o in orgs}
        org_text = " ".join(orgs).upper()

        if "RBI" in org_set or "RESERVE BANK OF INDIA" in org_text:
            cko.document_type = "RBI Circular"
        elif "SEBI" in org_set:
            cko.document_type = "SEBI Circular"
        elif "MCA" in org_set:
            cko.document_type = "MCA Circular"
        # else: leave cko.document_type as whatever was set (e.g. "Unclassified Document")

        print("[AI] Entity Engine Completed")

        return cko