now=$(date -d "today" +"%Y%m%d-%H%M")
echo backup local
/usr/bin/mysqldump iae-nuevo --single-transaction -R -u root --password=lani0363 > iae-nuevo-local_$now.sql
echo bzip2
/bin/bzip2 iae-nuevo-local_$now.sql
#scp iae-nuevo-local_$now.sql.bz2 iaeg.dyndns.org:/prg/iae
#ssh iaeg.dyndns.org "cd /prg/iae;sh ./procesa_base_sin_backup_local.sh iae-nuevo-local_$now.sql.bz2;rm " 
#exit 1
echo cp al nas
sudo /bin/cp iae-nuevo-local_$now.sql.bz2 /mnt/nas/backupsBase/$now.bz2
/bin/mv iae-nuevo-local_$now.sql.bz2 /dostera/shares/zoot/backups-iae-nuevo/$now.bz2
echo listooo la base
echo ahora depaso un backup de etc al nas
sudo rsync -L --progress -r -u /etc /mnt/nas/etc.backup
