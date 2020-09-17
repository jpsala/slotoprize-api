cd /prg/api
echo estoy en $(pwd)
echo rm
rm wopidom.dump > /dev/null 2>&1
echo "SET GLOBAL log_bin_trust_function_creators = 1;" > wopidom.dump
echo dump
mysqldump -u root --complete-insert --single-transaction --routines --triggers wopidom >> wopidom.dump
echo bzip2
rm -f wopidom.dump.bz2
bzip2 wopidom.dump
echo listo
