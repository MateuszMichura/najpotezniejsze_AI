@echo off
java -Xms1G -Xmx4G -XX:+UseG1GC -jar paper-1.20.4.jar nogui
pause