cd /prg/api
echo estoy en $(pwd)
echo zip
rm -f logs.zip
rm -f error.log.bz2
zip logs.zip info.log error.log
echo "**********************"
echo listo zip
echo "**********************"
