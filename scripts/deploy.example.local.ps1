# Скопируйте этот файл как deploy.local.ps1 (он в .gitignore) и подставьте свои значения.
# Тогда при запуске deploy.ps1 поля можно просто подтверждать Enter.

$DefaultHost = '194.58.95.224'
$DefaultUser = 'root'
$DefaultPort = '22'
# Путь на сервере, где лежат server.js, package.json и папка public/
$DefaultRemoteRoot = '/var/www/agile-business'
# Опционально: полный путь к id_ed25519 / id_rsa (иначе — пустая строка)
$DefaultIdentity = ''
