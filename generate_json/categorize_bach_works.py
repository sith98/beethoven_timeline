import json

genres = [
    "Cantatas",
    "Vocal Works",
    "Organ",
    "Chorale Preludes",
    "Major Piano Work",
    "Keyboard",
    "Contrapunctal",
]

wtc_bwvs = [str(i) for i in range(846, 869 + 1)] + [str(i) for i in range(870, 893 + 1)]

groups = [
    ("Orgelbüchlein", range(599, 644 + 1)),
    ("Schüblerchoräle", range(645, 651)),
    ("Choräle von verschiedener Art", range(651, 669)),
    ("Clavier-Übung III", range(669, 690)),
    ("Duette aus Clavier-Übung III", range(803, 806)),
    ("Kirnberger Choräle", range(690, 714)),
]


def main():
    with open("bach_works_temp.json") as file:
        works = json.load(file)

    cleaned_works = []
    for work in works:
        if "Spurious" in work["majorCategory"]:
            continue
        notes = work["notes"]

        found = False
        for w in [
            # "authorship uncertain",
            "spurious",
            "doubtful",
            "fragment only",
            "fragments only",
            "arr. of BWV",
            "alternative version of BWV",
            "rev. as",
            "Johann Ernst Eberlin",
            # Individual Cantatas appear seperately
            "Weihnachts-Oratorium",
        ]:
            if w in notes:
                found = True
                break
        if "lost" in notes and not "lost, but" in notes:
            found = True

        if not found:
            cleaned_works.append(work)

    works = cleaned_works

    minor_categories = []
    for work in works:
        cat = work["majorCategory"], work["minorCategory"]
        if len(minor_categories) == 0 or cat != minor_categories[-1]:
            minor_categories.append(cat)

        if cat[1] == "Cantatas":
            work["type"] = "Cantatas"
        elif cat[0] == "Vocal Works" and cat[1] in [
            "Motets",
            "Masses and Magnificats",
            "Passions and Oratorios",
        ]:
            work["type"] = "Vocal Works"
        elif "Organ" in cat[0] and "Chorale" in cat[1]:
            work["type"] = "Chorale Preludes"
        elif cat[0] == "Organ Works":
            work["type"] = "Organ"
        elif work["bwv"] in wtc_bwvs:
            work["type"] = "Major Piano Work"
        elif "Keyboard" in cat[0] and (
            ("Clavier-Übung" in work["notes"] and not "III" in work["notes"])
            or cat[1] in ["English Suites", "French Suites", "Inventions", "Sinfonias"]
        ):
            work["type"] = "Major Piano Work"
        elif "Keyboard" in cat[0]:
            work["type"] = "Keyboard"
        elif cat[0] in ["Canons", "Late Contrapuntal Works"]:
            work["type"] = "Contrapunctal"

    for cat in minor_categories:
        print(cat)

    for work in works:
        for name, r in groups:
            for bwv in r:
                if work["bwv"].startswith(str(bwv)):
                    work["notes"] = name + ", " + work["notes"]

    for work in works:
        work["year"] = work["date"]
        del work["date"]

    for work in works:
        work["id"] = f"BWV {work['bwv']}"

    works = [work for work in works if "–" not in work["bwv"] and work["bwv"] != ""]

    for work in works:
        try:
            og_year = work["year"]
            cleaned_year = og_year

            rev = "rev."
            if rev in cleaned_year:
                cleaned_year = cleaned_year[cleaned_year.index(rev) + len(rev) :]
                if "," in cleaned_year:
                    cleaned_year = cleaned_year[cleaned_year.index(",") + 1 :]

            to_ignore = [
                "or before",
                "or after",
                "after",
                "before",
                "(ca.)",
                "(?)",
                "ca.",
                "ca",
                "?",
                "Various",
            ]
            for s in to_ignore:
                cleaned_year = cleaned_year.replace(s, "")
            seperators = ["–", "-", "/", "—"]
            for s in seperators[1:]:
                cleaned_year = cleaned_year.replace(s, seperators[0])

            parts = [p.strip() for p in cleaned_year.split(seperators[0])]
            parts = [p for p in parts if len(p) > 0]
            parts = [int(p) for p in parts]
            parts = [p + (parts[0] // 100) * 100 if p < 100 else p for p in parts]
            # date = work[5].r
            if len(parts) >= 1:
                work["year"] = round(sum(parts) / len(parts))
                if work["year"] > 1900:
                    print(work["year"], og_year, parts, work)
        except Exception as e:
            # e.with_traceback()
            print(e)
            print("error", cleaned_year, og_year, work)

    works = [work for work in works if type(work["year"]) == int and "type" in work]

    new_genres = list(set([work["type"] for work in works]))
    with open("bach_works.json", "w") as file:
        json.dump(
            {
                "genres": genres,
                "colors": {g: "black" for g in new_genres},
                "works": works,
            },
            file,
        )


main()
