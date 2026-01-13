import csv

with open('skins_skin_backup copy.csv', 'r') as f:
    reader = csv.reader(f)
    # This counts rows without storing them in a list
    row_count = sum(1 for row in reader)
    print(row_count)
