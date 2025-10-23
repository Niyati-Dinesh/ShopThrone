export default function LoadingSpinner({ fullScreen = false, message = "Loading" }) {
  const containerClasses = fullScreen
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100"
    : "flex items-center justify-center py-12"

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-stone-200"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-600 border-r-amber-600 animate-spin"></div>
        </div>
        <h2 className="font-serif text-2xl text-stone-800 mb-2">{message}</h2>
        <p className="font-sans text-stone-500 text-sm tracking-wide">Please wait a moment</p>
      </div>
    </div>
  )
}
