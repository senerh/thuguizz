FROM mongo

copy thuguizzbd.json /thuguizzbd.json
CMD mongoimport --host mongodb --db thuguizzBD --collection questions --drop --type json --file /thuguizzbd.json --jsonArray
