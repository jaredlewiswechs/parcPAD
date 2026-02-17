"""
Example: Education Module Demo
Demonstrates Cards, Stacks, CMFK, and HyperLingo.
"""
from newton.cmfk import CMFKVector, parse_cmfk, bill_diagnose
from newton.education.cards import Card, Stack, Flow
from newton.education.teks import TEKSDatabase
from newton.education.hyperlingo import HyperLingoInterpreter


def main():
    # 1. Parse a student statement with CMFK
    student_text = "I'm not sure, maybe photosynthesis is just about water?"
    diagnosis = bill_diagnose(student_text)
    print("=== CMFK Diagnosis ===")
    print(f"Text: '{student_text}'")
    print(f"Shape: {diagnosis.shape}")
    v = diagnosis.vector
    print(f"Vector: C={v.c:.2f} M={v.m:.2f} F={v.f:.2f} K={v.k:.2f}")
    print("Teaching steps:")
    for step in diagnosis.steps:
        print(f"  {step}")

    # 2. Build a Card and Stack
    print("\n=== Card & Stack ===")
    card = Card(
        id="phot-001",
        title="What is Photosynthesis?",
        content=(
            "# Photosynthesis\n\n"
            "Plants convert **light energy** into **chemical energy** "
            "(glucose) using CO₂ and water.\n\n"
            "**Equation:** 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂"
        ),
        card_type="text",
        cmfk_target=CMFKVector(c=0.85, m=0.05, f=0.1, k=0.7),
    )
    stack = Stack(
        id="bio-stack-001",
        title="Introduction to Photosynthesis",
        cards=[card],
        teks_alignment=["112.14.b.5.A"],
    )
    print(f"Stack: '{stack.title}' — {stack.card_count()} card(s)")
    print(f"TEKS alignment: {stack.teks_alignment}")

    # 3. TEKS search
    print("\n=== TEKS Search: 'matter' ===")
    db = TEKSDatabase()
    results = db.search("matter")
    for r in results:
        print(f"  [{r.code}] {r.subject} / {r.grade}: {r.description[:60]}…")

    # 4. HyperLingo flow
    print("\n=== HyperLingo Flow ===")
    program = """
when cmfk.fog > 0.5:
    assign "Remedial Stack"
    show hint "Let's break this down step by step."
done
when cmfk.misconception > 0.3:
    record misconception "photosynthesis_water_only"
    assign "Misconception Correction Stack"
done
"""
    interp = HyperLingoInterpreter().parse(program)
    context = {"cmfk": {"fog": v.f, "misconception": v.m}}
    actions = interp.execute(context)
    print(f"Rules: {len(interp.rules)}")
    print(f"Triggered actions for context {context['cmfk']}:")
    for act in actions:
        print(f"  {act.verb}: {act.args}")


if __name__ == "__main__":
    main()
