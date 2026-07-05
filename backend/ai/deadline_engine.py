# ==========================================================
# REGMAP AI ENTERPRISE
# DEADLINE INTELLIGENCE ENGINE
# ==========================================================

import re
from datetime import datetime, timedelta


VALID_MONTHS = {
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"
}

MONTH_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2,
    "mar": 3, "march": 3, "apr": 4, "april": 4,
    "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "september": 9,
    "oct": 10, "october": 10, "nov": 11, "november": 11,
    "dec": 12, "december": 12
}


class DeadlineEngine:

    def __init__(self):
        pass

    # ======================================================
    # Validate and normalize a date string
    # ======================================================

    def _parse_date_expression(self, raw):
        """Try to parse a date expression. Returns a datetime or None."""
        raw = raw.strip()

        # Pattern: "20 January 2004"
        m = re.match(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", raw)
        if m:
            day, month_str, year = int(m.group(1)), m.group(2).lower(), int(m.group(3))
            if month_str not in VALID_MONTHS:
                return None
            month_num = MONTH_MAP.get(month_str)
            if not month_num or day < 1 or day > 31:
                return None
            try:
                return datetime(year, month_num, day)
            except ValueError:
                return None

        # Pattern: "20/01/2004"
        m = re.match(r"(\d{2})/(\d{2})/(\d{4})", raw)
        if m:
            try:
                return datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            except ValueError:
                return None

        # Pattern: "20-01-2004"
        m = re.match(r"(\d{2})-(\d{2})-(\d{4})", raw)
        if m:
            try:
                return datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            except ValueError:
                return None

        return None

    def _project_to_current_cycle(self, dt):
        """If a date is in the past, project it forward to the current year or next year."""
        today = datetime.now()
        projected = dt.replace(year=today.year)
        if projected < today:
            projected = projected.replace(year=today.year + 1)
        return projected

    # ======================================================
    # Deadline Analysis
    # ======================================================

    def analyze(self, cko):

        text = cko.raw_text
        today = datetime.now()

        raw_deadlines = []

        # ---- Extract explicit date expressions ----
        date_patterns = [
            r"\d{1,2}\s+[A-Za-z]+\s+\d{4}",
            r"\d{2}/\d{2}/\d{4}",
            r"\d{2}-\d{2}-\d{4}",
        ]

        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                parsed = self._parse_date_expression(match)
                if parsed is None:
                    continue  # Skip garbage like "20 CPA 2019"
                projected = self._project_to_current_cycle(parsed)
                days_left = (projected - today).days
                raw_deadlines.append({
                    "deadline": projected.strftime("%Y-%m-%d"),
                    "deadline_text": f"Compliance activity due by {projected.strftime('%d %B %Y')}",
                    "date_expression": projected.strftime("%d %B %Y"),
                    "days_remaining": max(days_left, 0),
                    "status": "Overdue" if days_left < 0 else ("Urgent" if days_left <= 7 else "Pending"),
                    "priority": "Critical" if days_left <= 7 else "High",
                    "original_text": match
                })

        # ---- Extract relative deadlines ("within X days") ----
        relative_patterns = [
            (r"within\s+(\d+)\s+days", "calendar"),
            (r"within\s+(\d+)\s+working\s+days", "working"),
            (r"within\s+(\d+)\s+business\s+days", "business"),
        ]

        for pattern, dtype in relative_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                num_days = int(match)
                if dtype in ("working", "business"):
                    num_days = int(num_days * 1.4)  # Approximate calendar days
                target_date = today + timedelta(days=num_days)
                days_left = num_days
                raw_deadlines.append({
                    "deadline": target_date.strftime("%Y-%m-%d"),
                    "deadline_text": f"Complete required activity within {match} {dtype} days",
                    "date_expression": target_date.strftime("%d %B %Y"),
                    "days_remaining": days_left,
                    "status": "Urgent" if days_left <= 7 else "Pending",
                    "priority": "Critical" if days_left <= 7 else "High",
                    "original_text": f"within {match} {dtype} days"
                })

        # ---- If no deadlines found, generate smart inferred ones ----
        if len(raw_deadlines) == 0:
            inferred_intervals = [30, 60, 90]
            for interval in inferred_intervals:
                target = today + timedelta(days=interval)
                raw_deadlines.append({
                    "deadline": target.strftime("%Y-%m-%d"),
                    "deadline_text": f"Regulatory review checkpoint ({interval}-day cycle)",
                    "date_expression": target.strftime("%d %B %Y"),
                    "days_remaining": interval,
                    "status": "Pending",
                    "priority": "High" if interval <= 30 else "Medium",
                    "original_text": f"Inferred {interval}-day deadline"
                })

        # ---- De-duplicate by deadline date ----
        unique = []
        seen = set()
        for item in raw_deadlines:
            if item["deadline"] not in seen:
                unique.append(item)
                seen.add(item["deadline"])

        # ---- Sort by date ascending ----
        unique.sort(key=lambda x: x["deadline"])

        cko.deadlines = unique

        print(f"[AI] Deadline Engine Completed ({len(unique)} deadlines)")

        return cko