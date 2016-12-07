FROM mongo

copy thuguizzbd.json /thuguizzbd.json
CMD mongoimport --host mongodb --db thuguizzbd --collection questions --drop --type json --file /thuguizzbd.json --jsonArray
