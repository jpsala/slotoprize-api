chmod 755 dist -R
rm -f api.bz2
echo compress
tar --create --bzip --verbose --file api.bz2 dist/
# > /dev/null 2>&1
echo scp
scp api.bz2 wopidom.homelinux.com:/tmp
cd -
ssh wopidom.homelinux.com 'rm -rf /prg/api/dist/* ; tar -jxvf /tmp/api.bz2 -C /prg/api > /dev/null 2>&1 ; chmod 755 /prg/recibo/api/dist -R'
rm -f api.bz2
echo Listo
