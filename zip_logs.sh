cd /prg/api
echo estoy en $(pwd)
echo zip
rm -f logs.zip
rm -f error.log.bz2
zip -v logs.zip info.log error.log
echo listo zip
echo "**********************"
