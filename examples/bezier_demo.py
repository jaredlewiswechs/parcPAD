"""
Example: Bézier Trajectory Verification
Demonstrates verifying a proposed trajectory against Ω.
"""
from newton.kernel import BezierCurve, Constraint, Omega, Point, Result
from newton.verifier import verify_trajectory


def main():
    # Define Ω = {x : 0 ≤ x[0] ≤ 1 AND 0 ≤ x[1] ≤ 1}
    omega = Omega(constraints=[
        Constraint(name="x_upper", fn=lambda p: p[0] - 1.0, description="x ≤ 1"),
        Constraint(name="x_lower", fn=lambda p: -p[0],       description="x ≥ 0"),
        Constraint(name="y_upper", fn=lambda p: p[1] - 1.0, description="y ≤ 1"),
        Constraint(name="y_lower", fn=lambda p: -p[1],       description="y ≥ 0"),
    ])

    # Curve 1: stays entirely within the unit square → fin
    safe = BezierCurve(
        p0=Point((0.1, 0.1)),
        h1=Point((0.3, 0.9)),
        h2=Point((0.7, 0.1)),
        p3=Point((0.9, 0.9)),
    )
    w1 = verify_trajectory(safe, omega)
    print(f"Safe curve  → {w1.result.value.upper()}  (violations: {len(w1.violations)})")

    # Curve 2: exits the unit square → finfr
    unsafe = BezierCurve(
        p0=Point((0.0, 0.0)),
        h1=Point((1.5, 0.5)),
        h2=Point((0.5, 1.5)),
        p3=Point((1.0, 1.0)),
    )
    w2 = verify_trajectory(unsafe, omega)
    print(f"Unsafe curve → {w2.result.value.upper()}  (violations: {len(w2.violations)})")
    if w2.violations:
        first = w2.violations[0]
        print(f"  First violation at t={first.get('t', '?'):.3f}: {first['constraint']}")


if __name__ == "__main__":
    main()
