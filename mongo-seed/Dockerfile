FROM mongo

copy thuguizzbd.json /thuguizzbd.json
copy players.json /players.json

CMD mongoimport --host mongodb --db thuguizzbd --collection players --drop --type json --file /players.json --jsonArray
CMD mongoimport --host mongodb --db thuguizzbd --collection questions --drop --type json --file /thuguizzbd.json --jsonArray
