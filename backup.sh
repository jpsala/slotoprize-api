now=$(date -d "today" +"%Y%m%d-%H%M")
echo backup local
/usr/bin/mysqldump wopidom --single-transaction -R -u root --password=lani0363 > wopidom-local_$now.sql
echo bzip2
/bin/bzip2 wopidom-local_$now.sql
echo listo la base