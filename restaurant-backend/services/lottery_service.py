import random
import database


def run_lottery_algorithm(lottery_id: str):
    """
    Execute the lottery logic based on probabilities defined in the database.
    """
    try:
        lottery = database.get_lottery_by_id(lottery_id)
        if not lottery or not lottery.get("prizes"):
            return None

        lucky_number = random.uniform(0, 100)
        current_probability = 0

        for prize in lottery["prizes"]:
            current_probability += prize["probability"]
            if lucky_number <= current_probability:
                return prize
        return None
    except Exception as e:
        print(f"Algorithm Error: {e}")
        return None
