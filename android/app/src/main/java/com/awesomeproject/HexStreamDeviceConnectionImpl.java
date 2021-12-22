package com.awesomeproject;

import android.bluetooth.BluetoothSocket;



import java.io.IOException;
import java.util.Properties;

import kjd.reactnative.bluetooth.conn.AbstractDeviceConnection;

public class HexStreamDeviceConnectionImpl extends AbstractDeviceConnection {

    private final StringBuffer mBuffer;
    private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();

    /**
     * Creates a new {@link AbstractDeviceConnection} to the provided NativeDevice, using the provided
     * Properties.
     *
     * @param socket
     * @param properties
     */
    public HexStreamDeviceConnectionImpl(BluetoothSocket socket, Properties properties) throws IOException {
        super(socket, properties);
        this.mBuffer = new StringBuffer();
    }

    @Override
    protected void receivedData(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }

        String data = new String(hexChars);
        synchronized (mBuffer) {
            mBuffer.append(data);
        }
    }

    @Override
    public int available() {
        synchronized (mBuffer) {
            return mBuffer.length();
        }
    }

    @Override
    public boolean clear() {
        synchronized (mBuffer) {
            mBuffer.delete(0, mBuffer.length());
            return true;
        }
    }

    @Override
    public String read() {
        return null;
    }


    public static void main(String[] args) {
        String str="abc你好";
        char[] chars = str.toCharArray();
        System.out.println(chars);
    }
}
