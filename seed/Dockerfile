FROM mongo

COPY ./start.sh /start.sh
COPY ./wait-for-it.sh /wait-for-it.sh
COPY ./dump ./dump

RUN chmod +x /wait-for-it.sh
RUN chmod +x /start.sh

CMD ["./start.sh"]
