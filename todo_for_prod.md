 - [x] create atlas table in DB
 - [x] add isDev en user table
 - [x] remove advertisingId field from game_user
 - [x] add deleted field in language table in DB
 - [x] add adsFree boolean in game_user default 0 not null in DB
 - [x] add devicePlataform in game_user varchar default '' not null in DB (va debajo de los otro 2 campos con device en el nombre del campo)
 - [x] in settings support email has to be support@tagadagames.com
 - [x] execute yarn to refresh dependencies (nodemailer)
 
 skin no se actuaza el skin

 - [ ] tutorialComplete new field on game_init, defaults to 0 y va con los booleans abajo
 - [ ] move isDev arriba de banned en game_init
 - [ ] add is_default boolean field to language with default 0 and set to 1 to the default one
 - [ ] copy localization table
 - [ ] delete devicePlataform after pull and verify that the profile post uses device_plataform instead
- [ ] call yarn to update
- [ ] apt install zip

 