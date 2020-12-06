 - [ ] delete devicePlataform after pull and verify that the profile post uses device_plataform instead
 - [x] create atlas table in DB
 - [x] add isDev en user table
 - [x] remove advertisingId field from game_user
 - [x] add deleted field in language table in DB
 - [x] add adsFree boolean in game_user default 0 not null in DB
 - [x] add devicePlataform in game_user varchar default '' not null in DB (va debajo de los otro 2 campos con device en el nombre del campo)
 - [x] in settings support email has to be support@tagadagames.com
 - [x] execute yarn to refresh dependencies (nodemailer)
 
 skin no se actuaza el skin

 - [x] tutorialComplete new field on game_init, defaults to 0 y va con los booleans abajo
 - [x] move isDev arriba de banned en game_init
 - [x] add is_default boolean field to language with default 0 and set to 1 to the default one
 - [ x copy localization table
- [x] copy tapjoy table to db
- [x] agregar localizations to live
- [x] call yarn to update
- [x] apt install zip


 - [x] add updated_at field to language table
 - [x] add agreements field to game_user table and set default false para los usuarios existentes tambien
 - [x] guardar en settings [

 - [x] copy apache options from dev

 - [x] create card (r) tables on db (card card_set card_set_claim game_user_card, card_drop_rate )
 - [x] hacer un backup de la base actual de live y pasarla a slotoprizes_live
 - [x] borrar todos los atlas de la db
 - [x] asegurarse de que todas las tablas tiene id con primary key, autoincrement y los foreign keys que correspondan

 - [x] remove yarn.lock
 - [x] yarn update
 - [x] cambiar las versiones del BO en settings