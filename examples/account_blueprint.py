"""
Example: Account Blueprint
Demonstrates the f/g ratio (debt/assets) constraint with Newton verification.
"""
from newton.kernel import fg_ratio, Result
from newton.ledger import Ledger
from newton.verifier import Law, verified_commit


def main():
    ledger = Ledger()

    # Define constraint: liabilities / assets ≤ 1.0
    debt_law = Law(
        name="solvency",
        rule="ratio_le",
        description="Liabilities must not exceed assets (f/g ≤ 1.0).",
        field_f="liabilities",
        field_g="assets",
        threshold=1.0,
    )

    # Scenario 1: Solvent account (fin)
    solvent = {"liabilities": 50_000.0, "assets": 100_000.0}
    w = verified_commit(ledger, "account_solvent", solvent, [debt_law])
    ratio, _ = fg_ratio(solvent["liabilities"], solvent["assets"])
    print(f"Solvent account → {w.result.value.upper()}  (ratio={ratio:.2f})")

    # Scenario 2: Insolvent account (finfr)
    insolvent = {"liabilities": 120_000.0, "assets": 100_000.0}
    w2 = verified_commit(ledger, "account_insolvent", insolvent, [debt_law])
    ratio2, _ = fg_ratio(insolvent["liabilities"], insolvent["assets"])
    print(f"Insolvent account → {w2.result.value.upper()}  (ratio={ratio2:.2f})")

    print(f"\nLedger entries committed: {len(ledger)}")
    valid, _ = ledger.verify_chain()
    print(f"Chain integrity: {'OK' if valid else 'FAIL'}")


if __name__ == "__main__":
    main()
