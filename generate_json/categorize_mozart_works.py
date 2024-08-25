import csv
import json

# with open("cleaned_mozart_works.txt") as file:
#     lines = file.readlines()

# pattern = "https"
# for i, line in enumerate(lines):
#     line = line.strip()
#     if pattern in line:
#         http_index = line.index(pattern)
#         new_line = f'{line[:http_index]}"{line[http_index:]}"\n'
#         lines[i] = new_line


# with open("mozart_works.csv", "w") as file:
#     file.writelines(lines)


works = []
with open("mozart_works.csv") as file:
    reader = csv.reader(file)
    header = next(reader)
    works = [line for line in reader if len(line) != 0]

print(header)

json_data = []
new_works = []
for work in works:
    # if len(work) != 9:
    #     print(work)
    #     n_commas = len(work) - 9
    #     work = tuple(
    #         work[:2] + [",".join(work[2 : 2 + n_commas + 1])] + work[2 + n_commas + 1 :]
    #     )
    #     print(work)
    #     print("")
    # new_works.append(work)
    if work[0] == "—" or "Anh" in work[0]:
        continue

    try:
        parts = [int(p) for p in work[5].replace("?", "").split("–")]
        parts = [p + 1700 if p < 100 else p for p in parts]
        # date = work[5].r
        work[5] = round(sum(parts) / len(parts))
    except Exception as e:
        print("error", work)
    data = {}
    for field, name in zip(work, header):
        data[name.lower()] = field

    genre = work[6]
    title = work[2]
    forces = work[3]
    type = genre
    if "Piano Concerto" in title:
        type = "Piano Concerto"
    elif "Concerto" in title:
        type = "Concerto"
    elif "String Quartet" in title:
        type = "String Quartet"
    elif "Violin Sonata" in title:
        type = "Violin Sonata"
    elif "Symphony" in title:
        type = "Symphony"
    elif type == "Keyboard" and "Sonata" in title:
        type = "Piano Sonata"
    elif type == "Chamber" and "pf" in forces:
        type = "Piano Chamber"
    elif "Serenade" in title:
        type = "Serenade"
    elif "String Quintet" in title:
        type = "String Quintet"
    data["type"] = type
    data["year"] = data["date"]
    del data["date"]
    json_data.append(data)

    # if work[6] == "Keyboard" and "Sonata" in work[2]:
    #     # print(work)
    #     pass
    # if work[6] == "Orchestral" and "Symphony" in work[2]:
    #     # print(work)
    #     pass
    # if work[6] == "Chamber" and "String Quartet" in work[2]:
    #     # print(work)
    #     pass
    # if work[6] == "Chamber" and "String Quintet" in work[2]:
    #     print(work)
    #     pass

# with open("mozart_works_cleaned.csv", "w") as file:
#     writer = csv.writer(file)
#     writer.writerows(new_works)

with open("mozart_works.json", "w") as file:
    json.dump(json_data, file)
