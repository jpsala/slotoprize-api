echo ssh
ssh prod "sh /prg/api/zip_logs.sh"
mkdir -p logs.prod
rm -rf logs.prod/* 2>/dev/null
rm -rf logs.zip
echo scp
echo "*************************"
scp -C  prod:/prg/api/logs.zip  .
echo unzip
unzip logs.zip -d ./logs.prod