cd /prg/api
now=$(date -d "today" +"%Y%m%d-%H%M")
echo backup local
# /usr/bin/mysqldump slotoprizes --single-transaction -R -u root --password=lani0363 > slotoprizes-local_$now.sql
mysqldump slotoprizes --single-transaction -R -u admin --password=lani0363 -h slotoprizeslive.cdy8hosrrn6a.eu-west-3.rds.amazonaws.com > slotoprizes-local_$now.sql -vv
echo bzip2
/bin/bzip2 slotoprizes-local_$now.sql
echo listo el bzip2
scp ./slotoprizes-local_$now.sql.bz2 dev.slotoprizes.tagadagames.com:/prg/api/backups
echo backups ready in dev.slotoprizes.tagadagames.com:/prg/api/backups/slotoprizes-local_$now.sql.bz2
