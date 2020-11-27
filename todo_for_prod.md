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

 - [ ] delete devicePlataform after pull and verify that the profile post uses device_plataform instead
 - [ ] add updated_at field to language table
 - [ ] add agreements field to game_user table and set default to what marcos talks with rodrigo, el nuevo campo del profile, "agreements" va en false para los usuarios existentes tambien
 - [ ] copy apache options from dev
 - [ ] create card_set and card in db
 - [ ] remove yarn.lock
 - [ ] yarn update