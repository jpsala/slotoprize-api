ssh dev "sh /prg/api/bzip_dev_logs.sh"
echo ################## volví del IAE
rm info.dev.log 2>/dev/null
rm error.dev.log 2>/dev/null
echo scp
scp -C  dev:/prg/api/info.log.bz2  .
scp -C  dev:/prg/api/error.log.bz2  .
echo bunzip2
bunzip2 info.log.bz2 -d ./info.dev.log
bunzip2 error.log.bz2 -d ./error.dev.log