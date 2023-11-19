import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

def create_log_table():
    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(database="flask_db",
                                user="postgres",
                                password="mskn34567",
                                host="localhost", port="5432")

        cur = conn.cursor()

        # Check if the 'log' table exists
        cur.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'log2')")
        table_exists = cur.fetchone()[0]

        if not table_exists:
            create_table_query = '''
                CREATE TABLE log2 (
                    id SERIAL PRIMARY KEY,
                    level VARCHAR(500),
                    message VARCHAR(500),
                    resourceId VARCHAR(500),
                    timestamp TIMESTAMP,
                    traceId VARCHAR(500),
                    spanId VARCHAR(500),
                    commit VARCHAR(500),
                    parentresourceid VARCHAR(500)
                );
            '''
            cur.execute(create_table_query)
            conn.commit()

        cur.close()
        conn.close()

    except Exception as e:
        print('Error creating log table:', str(e))

create_log_table()

@app.route('/ingest', methods=['GET', 'POST'])
def ingest_log():
    try:
        conn = psycopg2.connect(database="flask_db",
                                user="postgres",
                                password="mskn34567",
                                host="localhost", port="5432")

        log_data = request.json
        level = log_data.get('level')
        message = log_data.get('message')
        resourceId = log_data.get('resourceId')
        timestamp_str = log_data.get('timestamp')
        traceId = log_data.get('traceId')
        spanId = log_data.get('spanId')
        commit = log_data.get('commit')
        parentResourceId = log_data.get('metadata', {}).get('parentResourceId')

        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%SZ')

        insert_query = '''
            INSERT INTO log (level, message, resourceId, timestamp, traceId, spanId, commit, parentResourceId)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        '''

        cur = conn.cursor()
        cur.execute(insert_query, (level, message, resourceId, timestamp, traceId, spanId, commit, parentResourceId))
        conn.commit()

        cur.close()
        conn.close()

        print('Received log data:', log_data)

        return jsonify({'message': 'Log data received and stored successfully'})
    except Exception as e:
        print('Error processing log data:', str(e))
        return jsonify({'error': 'Failed to process log data', 'details': str(e)})
    
@app.route('/query_logs', methods=['POST'])
def query_logs():
    try:
        conn = psycopg2.connect(database="flask_db",
                                user="postgres",
                                password="mskn34567",
                                host="localhost", port="5432")

        # Extract filters from the request
        filters = request.json
        print("Filters", filters)
        select_query = 'SELECT * FROM log WHERE 1=1'

        for key, value in filters.items():
            formatted_key = key[0].lower() + key[1:] 
            if key == 'TimeStamp':
                print("Key Timestamp", key)
                if 'rangeSearch' in filters and filters['rangeSearch']:
                    print("Timestamp value", filters['TimeStamp']['startTime'])
                    startTime = datetime.strptime(filters['TimeStamp']['startTime'], '%Y-%m-%dT%H:%M:%SZ')
                    endTime = datetime.strptime(filters['TimeStamp']['endTime'], '%Y-%m-%dT%H:%M:%SZ')
                    print("EndTime", endTime)
                    
                    select_query += f''' AND timestamp BETWEEN '{startTime}' AND '{endTime}' '''

                else:
                    print("Key Timestamp", key)
                    timestamp = datetime.strptime(filters['TimeStamp'], '%Y-%m-%dT%H:%M:%SZ')
                    # filters['TimeStamp'] = timestamp.strftime('%Y-%m-%d %H:%M:%S')
            
                    select_query += f' AND {formatted_key} = %({key})s'
            elif key != 'rangeSearch' and key == 'Metadata.parentResourceId':
                 select_query += f' AND parentresourceid = %({key})s'
            elif key != 'rangeSearch':
                select_query += f' AND {formatted_key} = %({key})s'

        cur = conn.cursor()
        cur.execute(select_query, filters)

        logs = cur.fetchall()

        cur.close()
        conn.close()

        print('Querying logs with filters:', filters)
        return jsonify({'logs': logs})
    except Exception as e:
        print('Error querying logs:', str(e))
        return jsonify({'error': 'Failed to query logs', 'details': str(e)})


if __name__ == '__main__':
    app.run(port=3000)
