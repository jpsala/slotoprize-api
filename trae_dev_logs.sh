ssh dev "sh /prg/api/bzip_dev_logs.sh"
echo ################## volví del IAE
rm info.log 2>/dev/null
rm error.log 2>/dev/null
echo scp
scp -C  dev:/prg/api/info.log.bz2  .
scp -C  dev:/prg/api/error.log.bz2  .
echo bunzip2
bunzip2 info.log.bz2
bunzip2 error.log.bz2