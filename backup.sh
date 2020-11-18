cd /prg/api

now=$(date -d "today" +"%Y%m%d-%H%M")
echo backup local
/usr/bin/mysqldump wopidom --single-transaction -R -u root --password=lani0363 > wopidom-local_$now.sql
echo bzip2
/bin/bzip2 wopidom-local_$now.sql
echo listo el bzip2
scp ./wopidom-local_$now.sql.bz2 dev.slotoprizes.tagadagames.com:/prg/api/backups
echo backups ready in dev.slotoprizes.tagadagames.com:/prg/api/backups/wopidom-local_$now.sql.bz2