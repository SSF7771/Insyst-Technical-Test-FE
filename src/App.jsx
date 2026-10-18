import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:3001";

// npx json-server@0.17.4 --watch db.json --port 3001

export default function App() {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [slots, setSlots] = useState([]);

  // Form State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    participants: 1,
  });

  // UI State (status Loading, error, dan result)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  // Fetch Rooms
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/rooms`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Gagal memuat data ruangan");
        setLoading(false);
      });
  }, []);

  // Fetch Slots when room changes
  useEffect(() => {
    if (selectedRoom) {
      fetch(`${API_URL}/slots?roomId=${selectedRoom.id}`)
        .then((res) => res.json())
        .then((data) => setSlots(data))
        .catch(() => setError("Gagal memuat slot jam"));
    }
  }, [selectedRoom]);

  // Auto-select slot yang tersedia hanya jika pengguna belum memilih slot di step 2
  useEffect(() => {
    if (step == 2 && slots.length > 0 && !selectedSlot) {
      // Cari slot yang available (karena slots[0] atau slot awal tidak akan selalu available -> isAvailable: false)
      const firstAvailable = slots.find((s) => s.isAvailable);
      setSelectedSlot(firstAvailable || null);
    }
  }, [slots, step]);

  const handleNext = () => {
    setError("");
    if (step === 1 && !selectedRoom)
      return setError("Pilih ruangan terlebih dahulu!");

    if (step === 2 && (!selectedDate || !selectedSlot))
      return setError("Pilih tanggal dan slot jam!");

    if (step === 3) {
      if (!formData.name || !formData.email || !formData.phone)
        return setError("semua field wajib diisi");

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email))
        return setError("Format email tidak valid");
      if (formData.participants > selectedRoom.capacity) {
        return setError(
          `Kapasitas maksimal ruangan ini adalah ${selectedRoom.capacity} orang`,
        );
      }
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setError("");
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const payload = {
        bookingCode:
          "BK-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        roomId: selectedRoom.id,
        slotId: selectedSlot.id,
        date: selectedDate,
        ...formData,
      };

      // POST Booking
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal melakukan booking");

      // PATCH (meng-update sebagian data) Slot jadi false -> isAvailable: false
      const slotRes = await fetch(`${API_URL}/slots/${selectedSlot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: false }),
      });

      if (!slotRes.ok)
        console.warn("Gagal memperbarui status slot, tapi booking sukses.");

      // Set Sukses
      setBookingResult(data);
      setLoading(false);
      setStep(5);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Booking Ruang Meeting
        </h2>

        {/* Header (Tampilan Langkah Step 1 - 5) */}
        <div className="flex justify-between mb-8 text-sm font-medium text-gray-500">
          {["Pilih Ruangan", "Tanggal & Jam", "Data Pemesan", "Konfirmasi", "Hasil Booking"].map(
            (label, idx) => (
              <div
                key={idx}
                className={`flex items-center ${step === idx + 1 ? "text-blue-600 font-bold" : ""}`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 border 
                    ${step === idx + 1 ? "border-blue-600 bg-blue-50" : "border-gray-300"}
                    `}
                >
                  {idx + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ),
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-center py-4 text-blue-600">Memuat data...</div>
        )}

        {/* STEP 1: Pilih Ruangan */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Pilih Ruangan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room);
                  }}
                  className={`border rounded-lg p-4 cursor-pointer transition ${selectedRoom?.id === room.id ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300" : "hover:border-gray-400"}`}
                >
                  <h4 className="font-bold text-gray-800">{room.name}</h4>
                  <p className="text-sm text-gray-600">
                    Kapasitas: {room.capacity} orang
                  </p>
                  <p className="text-sm text-blue-600 font-semibold mt-2">
                    Rp {room.pricePerHour.toLocaleString()}/jam
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Tanggal & Jam */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Pilih Tanggal & Slot Waktu
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Booking
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Slot Jam
            </label>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.isAvailable}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 rounded-lg text-sm font-medium border 
                    ${
                      !slot.isAvailable
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : selectedSlot?.id === slot.id
                          ? "bg-blue-600 text-white"
                          : "bg-white hover:bg-gray-100"
                    }
                      `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Isi Data User untuk Booking */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Informasi Pemesan</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nomor HP
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jumlah Partisipan
              </label>
              <input
                type="number"
                min="1"
                max={selectedRoom.capacity}
                value={formData.participants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    participants: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Konfirmasi */}
        {step === 4 && (
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Konfirmasi Pemesanan
            </h3>
            <p>
              <strong>Ruangan:</strong> {selectedRoom?.name}
            </p>
            <p>
              <strong>Tanggal:</strong> {selectedDate}
            </p>
            <p>
              <strong>Jam:</strong> {selectedSlot?.time}
            </p>
            <p>
              <strong>Nama:</strong> {formData.name}
            </p>
            <p>
              <strong>Email:</strong> {formData.email}
            </p>
            <p>
              <strong>No HP:</strong> {formData.phone}
            </p>
            <p>
              <strong>Partisipan:</strong> {formData.participants} Orang
            </p>
          </div>
        )}

        {/* STEP 5: Sukses */}
        {step === 5 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Booking Sukses!
            </h3>
            <p className="text-gray-600 mb-4">
              Terima kasih, pesanan Anda telah dikonfirmasi.
            </p>
            <div className="bg-gray-100 p-3 rounded-lg inline-block text-lg font-mono font-bold text-blue-600 mb-6">
              Kode Booking:{" "}
              {bookingResult?.bookingCode || `BOOK-${bookingResult?.id || "XYZ123"}`}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedRoom(null);
                  setSelectedDate("");
                  setSelectedSlot(null);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    participants: 1,
                  });
                  setBookingResult(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Buat Pesanan Baru
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Kembali
              </button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lanjut
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {loading ? "Memproses..." : "Konfirmasi & Bayar"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}