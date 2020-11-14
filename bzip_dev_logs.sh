cd /prg/api
echo estoy en $(pwd)
echo bzip2
rm -f info.log.bz2
rm -f error.log.bz2
bzip2 info.log
bzip2 error.log
echo listo
