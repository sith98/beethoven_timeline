import json

with open("generate_json/beethoven_works_temp.json") as file:
    works = json.load(file)

# filter out works without opus number
works = [work for work in works if work["Op."] != "—"]

# filter out spurious works
works = [
    work
    for work in works
    if "spurious" not in work["Notes"].lower() and "doubt" not in work["Notes"].lower()
]

# for duplicate opus numbers use only the last one, unless they have different forces (i.e. it is a transcription)
works = list(reversed(sorted(works, key=lambda x: (x["Op."], x["Forces"]))))

filtered_works = []
for i in range(len(works)):
    work = works[i]
    if i == 0:
        filtered_works.append(work)
    else:
        if (
            work["Op."] == works[i - 1]["Op."]
            and work["Forces"] == works[i - 1]["Forces"]
        ):
            continue
        filtered_works.append(work)

works = list(reversed(filtered_works))

# for collection of songs, use collection.
# for other collections, use individual works

collection_works = {}
collection_individual_works = set()

for work in works:
    if "/" in work["Op."]:
        collection = work["Op."].split("/")[0]
        if collection not in collection_works:
            collection_works[collection] = []
        collection_works[collection].append(work)
        collection_individual_works.add(work["Op."])


filtered_works = []
for work in works:
    if work["Op."] in collection_works:
        if work["Genre"] == "Vocal" or "Airs" in work["Title"]:
            filtered_works.append(work)
        else:
            for w in collection_works[work["Op."]]:
                filtered_works.append(w)
    elif work["Op."] not in collection_individual_works:
        filtered_works.append(work)

works = filtered_works

# assign years

for work in works:
    try:
        og_year = work["Date"]
        cleaned_year = work["Date"]
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
        work["Date"] = round(sum(parts) / len(parts))
        if work["Date"] > 1900:
            print(work["Date"], og_year, parts, work)
    except Exception as e:
        print("error", cleaned_year, work)

output_works = []

# {
#     "id": "Hob.I:1",
#     "title": "",
#     "forces": "Orchestra",
#     "year": 1759,
#     "key": "D major",
#     "notes": "",
#     "type": "Symphony"
# },
genres = set()
for work in works:
    work_type = work["Genre"]
    if "Symphony No." in work["Title"]:
        work_type = "Symphony"
    if work_type == "Orchestral" and "Concerto" in work["Title"]:
        work_type = "Concerto"
    if work["Forces"] == "pf" and "Sonata" in work["Title"]:
        work_type = "Piano Sonata"
    if work_type == "Chamber" and "String Quartet" in work["Title"]:
        work_type = "String Quartet"
    if work_type == "Quintets":
        work_type = "Chamber"

    if "/" in work["Op."]:
        parts = work["Op."].split("/")
        opus = f"Op. {parts[0]}, No. {parts[1]}"
    else:
        opus = f"Op. {work['Op.']}"

    genres.add(work_type)

    output_works.append(
        {
            "id": opus,
            "title": work["Title"],
            "forces": work["Forces"],
            "year": work["Date"],
            "key": work["Key"],
            "notes": work["Notes"],
            "type": work_type,
        }
    )

with open("beethoven_works.json", "w") as file:
    json.dump(
        {
            "genres": list(genres),
            "colors": {g: "black" for g in list(genres)},
            "works": output_works,
        },
        file,
        indent=4,
    )
