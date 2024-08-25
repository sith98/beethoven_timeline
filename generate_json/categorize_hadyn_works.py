import json

with open("haydn_works_by_category.json") as file:
    data = json.load(file)

genres = [
    "Symphony",
    "String Quartet",
    "Piano Trio",
    "Keyboard Sonata",
    "Mass",
    "Oratorio",
    "Concerto",
    "Baryton Concerto",
    "Keyboard Concerto",
    "Baryton Trio",
    "Baryton Duo",
    "Baryton Chamber",
    "Opera",
    "The Seven Last Words of Christ & Stabat Mater",
]

works = []
for c in data:
    print(c["name"])
    if c["name"] not in genres:
        continue
    for work in c["works"]:
        work["type"] = c["name"]
    works.extend(c["works"])

for work in works:
    if "Concerto" in work["type"]:
        work["type"] = "Concerto"
    if "Baryton" in work["type"]:
        work["type"] = "Baryton"
    if work["type"] in [
        "Mass",
        "Oratorio",
        "The Seven Last Words of Christ & Stabat Mater",
    ]:
        work["type"] = "Major Vocal Work"
    try:
        og_year = work["year"]
        cleaned_year = work["year"]
        rev = "rev."
        if rev in cleaned_year:
            cleaned_year = cleaned_year[cleaned_year.index(rev) + len(rev) :]

        to_ignore = ["or before", "or after", "(ca.)", "(?)", "ca.", "ca", "?"]
        for s in to_ignore:
            cleaned_year = cleaned_year.replace(s, "")
        seperators = ["–", "-", "/"]
        for s in seperators[1:]:
            cleaned_year = cleaned_year.replace(s, seperators[0])

        if cleaned_year == "":
            continue

        parts = [int(p) for p in cleaned_year.split(seperators[0])]
        parts = [p + (parts[0] // 100) * 100 if p < 100 else p for p in parts]
        # date = work[5].r
        work["year"] = round(sum(parts) / len(parts))
        if work["year"] > 1900:
            print(work["year"], og_year, parts, work)
    except Exception as e:
        print("error", cleaned_year, work)

works = [work for work in works if type(work["year"]) == int]

new_genres = list(set([work["type"] for work in works]))
with open("haydn_works.json", "w") as file:
    json.dump(
        {
            "genres": new_genres,
            "colors": {g: "black" for g in new_genres},
            "works": works,
        },
        file,
    )
