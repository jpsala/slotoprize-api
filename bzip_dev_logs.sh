cd /prg/api
echo estoy en $(pwd)
echo bzip2
rm -f info.log.bz2
rm -f error.log.bz2
bzip2 -k info.log
bzip2 -k error.log
echo listo
