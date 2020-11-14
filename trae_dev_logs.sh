echo ssh
ssh dev "sh /prg/api/zip_logs.sh"
mkdir -p logs.dev
rm -rf logs.dev/* 2>/dev/null
rm -rf logs.zip
echo scp
echo "*************************"
scp -C  dev:/prg/api/logs.zip  .
echo unzip
unzip logs.zip -d ./logs.dev