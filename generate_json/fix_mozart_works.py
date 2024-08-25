import json

with open("mozart_works.json") as file:
    data = json.load(file)

for work in data["works"]:
    work["id"] = f"K. {work['k']}"

with open("fixed_mozart_works.json", "w") as file:
    json.dump(data, file)
