import sys
import json
import os
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QLabel, QLineEdit, QMessageBox
from PyQt5.QtGui import QColor
from PyQt5.QtCore import Qt

# Define the path to the folder containing the HTML, CSS, and JS files
web_dir = os.path.join(os.path.dirname(__file__), 'web')

# Define the handler to serve the static files
class CustomHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/db/trucks.json':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            with open(os.path.join(web_dir, 'trucks.json'), 'r') as file:
                self.wfile.write(file.read().encode())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/db/trucks.json':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            with open(os.path.join(web_dir, 'trucks.json'), 'w') as file:
                file.write(post_data.decode())
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success'}).encode())

# Function to start the web server
def start_server(port, status_label):
    os.chdir(web_dir)
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHandler)
    status_label.setText(f"Server running on port {port}")
    status_label.setStyleSheet("color: green;")
    webbrowser.open(f'http://localhost:{port}')  # Open the browser automatically
    httpd.serve_forever()

# Function to stop the server
def stop_server(server_thread, status_label):
    if server_thread and server_thread.is_alive():
        server_thread._stop()  # Forcefully stop the thread (not ideal but works for demo purposes)
        status_label.setText("Server stopped")
        status_label.setStyleSheet("color: red;")
    else:
        status_label.setText("Server is not running")

class ControlPanel(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.server_thread = None

    def init_ui(self):
        self.setWindowTitle('Web Server Control Panel')
        self.setGeometry(100, 100, 400, 300)  # Increased window size

        layout = QVBoxLayout()

        self.port_input = QLineEdit()
        self.port_input.setPlaceholderText('Enter port number (e.g., 8000)')
        self.port_input.setStyleSheet('color: white; background-color: #333;')  # White text on dark background
        layout.addWidget(self.port_input)

        self.start_button = QPushButton('Start Server')
        self.start_button.clicked.connect(self.start_server)
        layout.addWidget(self.start_button)

        self.stop_button = QPushButton('Stop Server')
        self.stop_button.clicked.connect(self.stop_server)
        layout.addWidget(self.stop_button)

        self.restart_button = QPushButton('Restart Server')
        self.restart_button.clicked.connect(self.restart_server)
        layout.addWidget(self.restart_button)

        self.status_label = QLabel('Server status')
        layout.addWidget(self.status_label)

        self.url_label = QLabel('URL:')
        layout.addWidget(self.url_label)

        self.setLayout(layout)

    def start_server(self):
        port_text = self.port_input.text()
        if not port_text:
            QMessageBox.warning(self, 'Input Error', 'Port number cannot be empty.')
            return
        
        try:
            port = int(port_text)
            if port < 1024 or port > 65535:
                raise ValueError("Port number out of range.")
        except ValueError as e:
            QMessageBox.warning(self, 'Input Error', f'Invalid port number: {e}')
            return
        
        if self.server_thread and self.server_thread.is_alive():
            QMessageBox.information(self, 'Error', 'Server is already running.')
            return
        
        self.server_thread = threading.Thread(target=start_server, args=(port, self.status_label), daemon=True)
        self.server_thread.start()
        self.url_label.setText(f'URL: http://localhost:{port}')

    def stop_server(self):
        if self.server_thread and self.server_thread.is_alive():
            stop_server(self.server_thread, self.status_label)
        else:
            QMessageBox.information(self, 'Error', 'Server is not running.')

    def restart_server(self):
        if self.server_thread and self.server_thread.is_alive():
            stop_server(self.server_thread, self.status_label)
            self.server_thread.join()  # Ensure the old thread stops completely

        self.start_server()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    app.setStyle('Fusion')  # Apply dark theme

    palette = app.palette()
    palette.setColor(palette.Window, QColor(53, 53, 53))
    palette.setColor(palette.WindowText, QColor(255, 255, 255))
    palette.setColor(palette.Button, QColor(53, 53, 53))
    palette.setColor(palette.ButtonText, QColor(255, 255, 255))
    palette.setColor(palette.Base, QColor(25, 25, 25))
    palette.setColor(palette.AlternateBase, QColor(53, 53, 53))
    palette.setColor(palette.ToolTipBase, QColor(255, 255, 255))
    palette.setColor(palette.ToolTipText, QColor(255, 255, 255))
    app.setPalette(palette)

    window = ControlPanel()
    window.show()
    sys.exit(app.exec_())
